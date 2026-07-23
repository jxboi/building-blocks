using FluentValidation;
using Kernel.Messaging;
using Kernel.Results;

namespace UnitTests.Kernel;

public sealed class ValidationBehaviorTests
{
    private sealed record TestCommand(string Name) : ICommand;

    private sealed class TestCommandValidator : AbstractValidator<TestCommand>
    {
        public TestCommandValidator() => RuleFor(c => c.Name).NotEmpty().WithMessage("Name is required.");
    }

    [Fact]
    public async Task Passes_through_when_valid()
    {
        var behavior = new ValidationBehavior<TestCommand, Result>([new TestCommandValidator()]);
        var handlerCalled = false;

        var result = await behavior.HandleAsync(
            new TestCommand("ok"),
            () =>
            {
                handlerCalled = true;
                return Task.FromResult(Result.Success());
            },
            CancellationToken.None);

        Assert.True(handlerCalled);
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Short_circuits_with_validation_error_when_invalid()
    {
        var behavior = new ValidationBehavior<TestCommand, Result>([new TestCommandValidator()]);
        var handlerCalled = false;

        var result = await behavior.HandleAsync(
            new TestCommand(string.Empty),
            () =>
            {
                handlerCalled = true;
                return Task.FromResult(Result.Success());
            },
            CancellationToken.None);

        Assert.False(handlerCalled);
        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(nameof(TestCommand.Name), validationError.Errors.Keys);
        Assert.Contains("Name is required.", validationError.Errors[nameof(TestCommand.Name)]);
    }

    [Fact]
    public async Task Passes_through_when_no_validators()
    {
        var behavior = new ValidationBehavior<TestCommand, Result>([]);

        var result = await behavior.HandleAsync(
            new TestCommand(string.Empty),
            () => Task.FromResult(Result.Success()),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
    }
}
